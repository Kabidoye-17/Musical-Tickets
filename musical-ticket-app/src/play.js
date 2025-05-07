const CryptoJS = require('crypto-js');

const walletAddresses = [
  "0xE8B6417E591312225393276B69bd78F699198F42", // Venue wallet
  "0xfC9a7b3aAC9fD637a2499bf291fDeF190f92BdF0"  // Doorman wallet
];

walletAddresses.forEach(address => {
  // Use EXACTLY the same function as in your React component
  const hash = CryptoJS.SHA256(address.trim().toLowerCase()).toString();
  console.log(`${address} => ${hash}`);
});