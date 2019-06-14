USE PRCorp
GO
-- Create a new table called 'Officers' in schema 'dbo'
-- Drop the table if it already exists
IF OBJECT_ID('dbo.Officers', 'U') IS NOT NULL
DROP TABLE dbo.Officers
GO
-- Create the table in the specified schema
CREATE TABLE dbo.Officers
(
    offID INT IDENTITY NOT NULL PRIMARY KEY, -- primary key column
    crpID INT NOT NULL FOREIGN KEY REFERENCES Corporation(crpID) ON DELETE CASCADE, -- foreign key
    offYear INT NOT NULL,
    offSeq INT NOT NULL,
    offName [NVARCHAR](250) NULL,
    offTitle [NVARCHAR](250) NULL,
    offMail [NVARCHAR](250) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX [IX_Officers_crpID] NONCLUSTERED ([crpID])
    -- specify more columns here
);
GO