# Security Policies

| path                 | method | required login? | required owner? |
| :------------------- | :----- | :-------------: | :-------------: |
| /wallets             | GET    |        /        |        X        |
| /wallets             | POST   |        /        |        X        |
| /wallets/:id         | GET    |        /        |        /        |
| /wallets/:id         | PUT    |        /        |        /        |
| /wallets/:id         | DELETE |        /        |        /        |
| /wallets/:id/balance | GET    |        /        |        /        |
