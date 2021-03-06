# binance-futures-follow-up

This module allows you to check the positions opened or closed on a Binance Futures account .

## Installation

Make sure to have NodeJS and npm installed on your machine.

To install dependencies, run:

```
yarn install
```

## Configure

update the `src/accounts.json` file to enter the account name / username and api key /secret

Exemple:

```json
{
  "accounts": [
    {
      "name": "dream team",
      "username": "dream@pm.me",
      "apiKey": "56ds4q654d6q5s4d6sq46d54qs67d8d13f1b7162ad9a4756",
      "apiSecret": "456dq465d4q6s54d65sqbf36b62f43167ed7c7a29ad5a58ce14dd4dc5",
      "test": false
    },
    {
      "name": "ZUYPER team",
      "username": "zuyper@protonmail.com",
      "apiKey": "2e10d610d53f530d992f05ad4e8d399496456s4q65s4564s56q456sq",
      "apiSecret": "54d6q5456sd46qs54d65qs4cfb3306a87729b1b40f2631e2dda39",
      "test": true
    }
  ]
}
```

you can add a testnet account by setting the `field` test to true
click here to create a [binance futures test account](https://testnet.binancefuture.com)

you will find your api keys once logged in at the bottom of the screen in the **API Key** tab the

## Start

Start the script with:

```
yarn start
```

click the refresh button to get the latest positions
