// src/styles/GlobalStyles.js
import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  body {
    background-color: #000000;
    color: #ffffff;
    margin: 0;
    padding: 0;
    font-family: 'Roboto', sans-serif;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #ffffff;
  }

  a {
    color: #ffffff;
    text-decoration: none;
  }

  button {
    font-family: 'Roboto', sans-serif;
  }
`;

export default GlobalStyles;
