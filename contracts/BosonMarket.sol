//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./BosonEscrow.sol";

/**
 * @dev BosonToken Token implementation.
 */
contract BosonMarket is Ownable {
    enum eOrderStatus {
        Ordered,
        Completed,
        Complained
    }
    struct ItemData {
        bytes32 title;
        uint256 price;
        uint32 availableQuantity;
        uint32 orderedQuantity;
        address seller;
    }

    struct OrderData {
        eOrderStatus status;
        address buyer;
        uint256[] itemIds;
        uint32[] quantities;
    }

    address public escrowAddress;
    mapping(uint256 => ItemData) public itemDatas;
    uint256 public nbItems;
    mapping(uint256 => OrderData) private orders;
    mapping(address => uint32) private nbOrdersPerBuyer;
    uint256 public nbOrders;

    event OnNewItem(
        uint256 indexed itemId,
        address indexed seller,
        bytes32 title,
        uint256 price,
        uint32 quantity
    );
    event OnNewOrder(uint256 indexed orderId, address indexed buyer);

    constructor(address _escrowAddress) {
        escrowAddress = _escrowAddress;
    }

    /**
     * @dev Check the caller has created the order referenced with the given orderId
     *
     */
    modifier onlyOrderBuyer(uint256 orderId) {
        require(isValidOrderId(orderId), "BosonMarket: Invalid orderId");
        require(
            msg.sender == orders[orderId].buyer,
            "BosonMarket: NOT AUTHORIZED"
        );
        _;
    }

    /**
     * @dev Check the caller has created the item referenced with the given itemId
     *
     */
    modifier onlyItemSeller(uint256 itemId) {
        require(isValidItemId(itemId), "BosonMarket: Invalid itemId");
        require(
            msg.sender == itemDatas[itemId].seller,
            "BosonMarket: NOT AUTHORIZED"
        );
        _;
    }

    /**
     * @dev Check the order referenced with the given orderId is in the given status
     *
     */
    modifier orderStatus(uint256 orderId, eOrderStatus status) {
        require(isValidOrderId(orderId), "BosonMarket: Invalid orderId");
        require(
            orders[orderId].status == status,
            "BosonMarket: Invalid Order State"
        );
        _;
    }

    /**
     * @dev Put an item on sale with specified title, price and quantity
     *
     * Emits a {OnNewItem} event with the itemId of the offered item.
     */
    function offerItem(bytes32 title, uint256 price, uint32 quantity) external {
        uint256 itemId = nbItems++;
        itemDatas[itemId].title = title;
        itemDatas[itemId].price = price;
        itemDatas[itemId].availableQuantity = quantity;
        itemDatas[itemId].orderedQuantity = 0;
        itemDatas[itemId].seller = msg.sender;
        emit OnNewItem(itemId, msg.sender, title, price, quantity);
    }

    /**
     * @dev Order a set of items, given a quantity for each of them
     *
     * Emits a {OnNewOrder} event with the orderId of the created order
     *
     * Requirements:
     *
     * - the caller must own enough tokens to 'pay' for all items contained in the order
     * - the caller must have approve the escrow contract for at least enough tokens required to pay the order
     * - the available quantity of items must be greater or equal to the ordered quantity
     */
    function order(
        uint256[] calldata itemIds,
        uint32[] calldata quantities
    ) external {
        require(
            itemIds.length == quantities.length,
            "BosonMarket: NON CONSISTENT ARGUMENTS LENGTH"
        );
        uint256 totalPrice = 0;
        for (uint32 i = 0; i < itemIds.length; i++) {
            uint256 itemId = itemIds[i];
            uint32 quantity = quantities[i];
            require(isValidItemId(itemId), "BosonMarket: Invalid itemId");
            ItemData storage item = itemDatas[itemId];
            require(
                item.availableQuantity >= quantity,
                "BosonMarket: Requested Quantity Not Available"
            );
            item.availableQuantity -= quantity;
            item.orderedQuantity += quantity;
            totalPrice = totalPrice + item.price * quantity;
        }
        address buyer = msg.sender;
        BosonEscrow(escrowAddress).placePayment(buyer, totalPrice);
        uint256 orderId = nbOrders++;
        orders[orderId].status = eOrderStatus.Ordered;
        orders[orderId].buyer = buyer;
        orders[orderId].itemIds = itemIds;
        orders[orderId].quantities = quantities;
        nbOrdersPerBuyer[buyer]++;
        emit OnNewOrder(orderId, buyer);
    }

    /**
     * @dev Complete the order referenced by the given orderId
     *
     * Requirements:
     *
     * - the order must not have been completed or complained before
     * - the caller is the same account that has created this order
     */
    function complete(
        uint256 orderId
    )
        external
        onlyOrderBuyer(orderId)
        orderStatus(orderId, eOrderStatus.Ordered)
    {
        OrderData storage _order = orders[orderId];
        address buyer = _order.buyer;
        for (uint32 i = 0; i < _order.itemIds.length; i++) {
            uint256 itemId = _order.itemIds[i];
            uint32 quantity = _order.quantities[i];
            ItemData storage item = itemDatas[itemId];
            address seller = item.seller;
            BosonEscrow(escrowAddress).pay(
                buyer,
                seller,
                item.price * quantity
            );
        }
        _order.status = eOrderStatus.Completed;
    }

    /**
     * @dev Complain for the order referenced by the given orderId
     *
     * Requirements:
     *
     * - the order must not have been completed or complained before
     * - the caller is the same account that has created this order
     */
    function complain(
        uint256 orderId
    )
        external
        onlyOrderBuyer(orderId)
        orderStatus(orderId, eOrderStatus.Ordered)
    {
        OrderData storage _order = orders[orderId];
        address buyer = _order.buyer;
        for (uint32 i = 0; i < _order.itemIds.length; i++) {
            uint256 itemId = _order.itemIds[i];
            uint32 quantity = _order.quantities[i];
            ItemData storage item = itemDatas[itemId];
            BosonEscrow(escrowAddress).refund(buyer, item.price * quantity);
        }
        _order.status = eOrderStatus.Complained;
    }

    /**
     * @dev Gets the requested price for ordering the specified set of items, given a quantity for each of them
     *
     */
    function computePrice(
        uint256[] calldata itemIds,
        uint32[] calldata quantities
    ) external view returns (uint256 totalPrice) {
        require(
            itemIds.length == quantities.length,
            "BosonMarket: NON CONSISTENT ARGUMENTS LENGTH"
        );
        totalPrice = 0;
        for (uint32 i = 0; i < itemIds.length; i++) {
            uint256 itemId = itemIds[i];
            uint32 quantity = quantities[i];
            require(isValidItemId(itemId), "BosonMarket: Invalid itemId");
            ItemData storage item = itemDatas[itemId];
            totalPrice = totalPrice + item.price * quantity;
        }
    }

    /**
     * @dev Gets the ids of all orders made by the caller
     *
     */
    function getMyOrders() external view returns (uint256[] memory _orderIds) {
        address buyer = msg.sender;
        uint32 nbBuyerOrders = nbOrdersPerBuyer[buyer];
        require(nbBuyerOrders > 0, "BosonMarket: No order for specified buyer");
        _orderIds = new uint256[](nbBuyerOrders);
        uint32 index = 0;
        for (uint32 i = 0; i < nbOrders; i++) {
            if (orders[i].buyer == buyer) {
                _orderIds[index++] = i;
            }
        }
    }

    /**
     * @dev Gets the data of the order referenced by the given orderId
     *
     * Requirements:
     *
     * - the caller is the same account that has created this order or the caller is the current contract's owner
     */
    function getOrderData(
        uint256 orderId
    )
        external
        view
        returns (
            eOrderStatus status,
            address buyer,
            uint256[] memory itemIds,
            uint32[] memory quantities
        )
    {
        require(isValidOrderId(orderId), "BosonMarket: Invalid orderId");
        OrderData storage _order = orders[orderId];
        require(
            (msg.sender == owner()) || (_order.buyer == msg.sender),
            "BosonMarket: Not Authorized"
        );
        status = _order.status;
        buyer = _order.buyer;
        itemIds = new uint256[](_order.itemIds.length);
        quantities = new uint32[](_order.quantities.length);
        for (uint32 index = 0; index < _order.itemIds.length; index++) {
            itemIds[index] = _order.itemIds[index];
            quantities[index] = _order.quantities[index];
        }
    }

    /**
     * @dev Reset all internal data, only usefull for demo purpose
     *
     * Requirements:
     *
     * - the caller is the current contract's owner
     */
    function reset() public onlyOwner {
        for (uint i = 0; i < nbItems; i++) {
            delete itemDatas[i];
        }
        nbItems = 0;
        for (uint i = 0; i < nbOrders; i++) {
            address buyer = orders[i].buyer;
            delete nbOrdersPerBuyer[buyer];
            delete orders[i];
        }
        nbOrders = 0;
        BosonEscrow(escrowAddress).reset();
    }

    function isValidItemId(uint256 itemId) internal view returns (bool) {
        return itemId < nbItems;
    }

    function isValidOrderId(uint256 orderId) internal view returns (bool) {
        return orderId < nbOrders;
    }
}
