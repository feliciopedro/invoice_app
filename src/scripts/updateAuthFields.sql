-- SQL script to update User table with authentication fields
-- Run this manually in your PostgreSQL database

-- Add new authentication fields to users table
ALTER TABLE users 
ADD COLUMN emailVerificationToken TEXT,
ADD COLUMN emailVerificationExpiry TIMESTAMP,
ADD COLUMN passwordResetToken TEXT,
ADD COLUMN passwordResetExpiry TIMESTAMP,
ADD COLUMN loginAttempts INTEGER DEFAULT 0,
ADD COLUMN lockoutUntil TIMESTAMP,
ADD COLUMN lastLoginAt TIMESTAMP;

-- Update existing columns if they have different names
-- (This is safe to run even if columns don't exist)
DO $$
BEGIN
    -- Rename emailVerifyToken to emailVerificationToken if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'emailVerifyToken') THEN
        ALTER TABLE users RENAME COLUMN emailVerifyToken TO emailVerificationToken;
    END IF;

    -- Rename resetPasswordToken to passwordResetToken if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'resetPasswordToken') THEN
        ALTER TABLE users RENAME COLUMN resetPasswordToken TO passwordResetToken;
    END IF;

    -- Rename resetPasswordExpires to passwordResetExpiry if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'resetPasswordExpires') THEN
        ALTER TABLE users RENAME COLUMN resetPasswordExpires TO passwordResetExpiry;
    END IF;

    -- Rename lastLogin to lastLoginAt if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'lastLogin') THEN
        ALTER TABLE users RENAME COLUMN lastLogin TO lastLoginAt;
    END IF;
END $$;