pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";


contract SimpleToken is DetailedERC20, StandardToken {
    string _name = "Simple Token A";
    string _symbol = "STA";
    uint8 _decimals = 18;
    uint256 _amount = 1000;
  constructor()
    DetailedERC20(_name, _symbol, _decimals)
    public
  {
    require(_amount > 0, "amount has to be greater than 0");
    totalSupply_ = _amount.mul(10 ** uint256(_decimals));
    balances[msg.sender] = totalSupply_;
    emit Transfer(address(0), msg.sender, totalSupply_);
  }
}


