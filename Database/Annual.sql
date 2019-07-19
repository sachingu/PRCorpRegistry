USE PRCorp
GO
-- Create a new table called 'Annual' in schema 'dbo'
-- Drop the table if it already exists
IF OBJECT_ID('dbo.Annual', 'U') IS NOT NULL
DROP TABLE dbo.Annual
GO
-- Create the table in the specified schema
CREATE TABLE dbo.Annual
(
    annID INT IDENTITY NOT NULL PRIMARY KEY, -- primary key column
    crpID INT NOT NULL FOREIGN KEY REFERENCES Corporation(crpID) ON DELETE CASCADE, -- foreign key
    annYear INT NOT NULL,
    annName [NVARCHAR](250) NULL,
    annStreet [NVARCHAR](250) NULL,
    annPhone [NVARCHAR](250) NULL,
    annEmail [NVARCHAR](250) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX [IX_Annual_crpID] NONCLUSTERED ([crpID])
    -- specify more columns here
);
GO