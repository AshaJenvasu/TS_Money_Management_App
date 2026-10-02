# Security Policies

| path                 | method | required login? | required owner? |          remarks           |
| :------------------- | :----- | :-------------: | :-------------: | :------------------------: |
| /wallets             | GET    |        /        |        /        | เฉพาะกระเป๋าของuserคนนั้นๆ |
| /wallets             | POST   |        /        |        /        | เฉพาะกระเป๋าของuserคนนั้นๆ |
| /wallets/:id         | GET    |        /        |        /        |                            |
| /wallets/:id         | PUT    |        /        |        /        |                            |
| /wallets/:id         | DELETE |        /        |        /        |                            |
| /wallets/:id/balance | GET    |        /        |        /        |                            |
