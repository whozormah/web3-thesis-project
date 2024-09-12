const Search = () => {
  return (
    <header className="hero">
      <div className="hero__content">
        <h1 className="header__title">
          Decentralized Real Estate on the Blockchain
        </h1>
        <p className="header__subtitle">
          Discover, explore, and own properties securely through Web3.
          Transparent, tamper-proof transactions with instant verification. Buy,
          sell, or invest in real estate with the power of blockchain
          technology.
        </p>
        <input
          type="text"
          className="header__search"
          placeholder="Enter an address, neighborhood, city, or ZIP code"
        />
        <button className="header__cta">Explore Listings</button>
      </div>
    </header>
  );
};

export default Search;
