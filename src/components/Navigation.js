import { ethers } from "ethers";
import logo from "../assets/logo.svg"; // Assuming you have a logo

const Navigation = ({ account, setAccount }) => {
  const connectHandler = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = ethers.utils.getAddress(accounts[0]);
    setAccount(account);
  };

  return (
    <nav>
      {/* Move nav__brand before nav__links */}
      <div className="nav__brand">
        <h1>Uzed3.0</h1>
      </div>

      <ul className="nav__links">
        <li>
          <a href="#">Home</a>
        </li>
        <li>
          <a href="#">About Us</a>
        </li>
        <li>
          <a href="#">Learn More</a>
        </li>
        <li>
          <a href="#">Testimonials</a>
        </li>
      </ul>

      {account ? (
        <button type="button" className="nav__connect">
          {account.slice(0, 6) + "..." + account.slice(-4)}
        </button>
      ) : (
        <button type="button" className="nav__connect" onClick={connectHandler}>
          Connect
        </button>
      )}
    </nav>
  );
};

export default Navigation;
