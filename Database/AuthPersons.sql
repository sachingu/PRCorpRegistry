USE PRCorp
GO
-- Create a new table called 'AuthPersons' in schema 'dbo'
-- Drop the table if it already exists
IF OBJECT_ID('dbo.AuthPersons', 'U') IS NOT NULL
DROP TABLE dbo.AuthPersons
GO
-- Create the table in the specified schema
CREATE TABLE dbo.AuthPersons
(
    autID INT IDENTITY NOT NULL PRIMARY KEY, -- primary key column
    crpID INT NOT NULL FOREIGN KEY REFERENCES Corporation(crpID) ON DELETE CASCADE, -- foreign key
    admSeq INT NOT NULL,
    admName [NVARCHAR](250) NULL,
    admTitle [NVARCHAR](250) NULL,
    admStreet [NVARCHAR](250) NULL,
    admMail [NVARCHAR](250) NULL,
    admEMail [NVARCHAR](250) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX [IX_AuthPersons_crpID] NONCLUSTERED ([crpID])
    -- specify more columns here
);
GO