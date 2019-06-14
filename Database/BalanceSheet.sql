USE PRCorp
GO
-- Create a new table called 'BalanceSheet' in schema 'dbo'
-- Drop the table if it already exists
IF OBJECT_ID('dbo.BalanceSheet', 'U') IS NOT NULL
DROP TABLE dbo.BalanceSheet
GO
-- Create the table in the specified schema
CREATE TABLE dbo.BalanceSheet
(
    balID INT IDENTITY NOT NULL PRIMARY KEY, -- primary key column
    crpID INT NOT NULL FOREIGN KEY REFERENCES Corporation(crpID) ON DELETE CASCADE, -- foreign key
    balYear INT NOT NULL,
    balCurAssets [DECIMAL](13,2) NULL,
    balPropEq [DECIMAL](13,2) NULL,
    balOthAssets [DECIMAL](13,2) NULL,
    balTotAssets [DECIMAL](13,2) NULL,
    balCurLiabilities [DECIMAL](13,2) NULL,
    balLTLiabilities [DECIMAL](13,2) NULL,
    balEquity [DECIMAL](13,2) NULL,
    balTLE [DECIMAL](13,2) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX [IX_BalanceSheet_crpID] NONCLUSTERED ([crpID])
    -- specify more columns here
);
GO