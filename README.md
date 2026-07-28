# Agent cost-optimization

| Stage | sysTokens | policyTokens | historyTokens | toolsTokens | Total |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Original (duplicated policy) | 72 | 359 | 582 | 337 | 1350 |
| After Opt 1 (remove duplicate policy block) | 72 | — | 582 | 337 | 991 (−27%) |
| After Opt 2 (dynamic retrieval in history) | 72 | — | 252 | 337 | 661 (−51% total) |

