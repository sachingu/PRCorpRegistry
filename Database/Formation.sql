USE PRCorp
GO
-- Create a new table called 'Formation' in schema 'dbo'
-- Drop the table if it already exists
IF OBJECT_ID('dbo.Formation', 'U') IS NOT NULL
DROP TABLE dbo.Formation
GO
-- Create the table in the specified schema
CREATE TABLE dbo.Formation
(
    forID INT IDENTITY NOT NULL PRIMARY KEY, -- primary key column
    crpID INT NOT NULL FOREIGN KEY REFERENCES Corporation(crpID) ON DELETE CASCADE, -- foreign key
    forStreet [NVARCHAR](250) NULL,
    forMail [NVARCHAR](250) NULL,
    forRAName [NVARCHAR](250) NULL,
    forRAStreet [NVARCHAR](250) NULL,
    forRAMail [NVARCHAR](250) NULL,
    forRAEMail [NVARCHAR](250) NULL,
    forNature [NVARCHAR](MAX) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX [IX_Formation_crpID] NONCLUSTERED ([crpID])
    -- specify more columns here
);
GO