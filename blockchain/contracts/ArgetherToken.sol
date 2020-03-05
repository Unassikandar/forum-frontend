pragma solidity ^0.5.0;

contract ArgetherToken {

    // State Variables
    string public name = "Argether Token";
    string public symbol = "ARG";
    string public standard = "Argether Token v1.0";

    uint256 public totalSupply;

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _value
    );

    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );

    mapping(address => uint256) public balanceOf;

    // account A approves account B to spend C tokens
    mapping(address => mapping(address => uint256)) public allowance;

    constructor (uint256 _initialSupply) public {
        // allocate the initial supply
        balanceOf[msg.sender] = _initialSupply;
        totalSupply = _initialSupply;
    }

    function transfer(address _to, uint _value) public returns (bool success) {
        // Exception if account doesn't have enough tokens
        require(balanceOf[msg.sender] >= _value, "Not enough balance to complete the transfer");
        // Transfer the balance
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        // Transfer Event
        emit Transfer(msg.sender, _to, _value);
        // Return a boolean
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        // handle allowance
        allowance[msg.sender][_spender] = _value;
        // handle approve event
        emit Approval(msg.sender, _spender, _value);
        // returns a boolean
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        // require that _from has enough tokens
        require(_value <= balanceOf[_from], "value should be greater than balance");
        // require that allowance is big enough
        require(_value <= allowance[_from][msg.sender], "amount should be <= amount approved");
        // change the balance
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        // update the allowance
        allowance[_from][msg.sender] -= _value;
        // transfer event
        emit Transfer(_from, _to, _value);
        // return a boolean
        return true;
    }

}