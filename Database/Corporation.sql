USE PRCorp
GO
-- Create a new table called 'Corporation' in schema 'dbo'
-- Drop the table if it already exists
IF OBJECT_ID('dbo.Corporation', 'U') IS NOT NULL
DROP TABLE dbo.Corporation
GO
-- Create the table in the specified schema
CREATE TABLE dbo.Corporation
(
    crpID INT IDENTITY NOT NULL PRIMARY KEY, -- primary key column
    crpRegisterNo INT NOT NULL,
    crpUrl [NVARCHAR](250) NOT NULL,
    crpName [NVARCHAR](250) NOT NULL,
    crpClass [NVARCHAR](250) NULL,
    crpType [NVARCHAR](250) NULL,
    crpStatus [NVARCHAR](250) NULL,
    crpJurisdiction [NVARCHAR](250) NULL,
    crpRAName [NVARCHAR](250) NULL,
    crpRAStreet1 [NVARCHAR](250) NULL,
    crpRAStreet2 [NVARCHAR](250) NULL,
    crpRAStreet3 [NVARCHAR](250) NULL,
    crpMAStreet1 [NVARCHAR](250) NULL,
    crpMAStreet2 [NVARCHAR](250) NULL,
    crpMAStreet3 [NVARCHAR](250) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX [IX_Corporation_crpRegisterNo] NONCLUSTERED ([crpRegisterNo])
    -- specify more columns here
);
GO