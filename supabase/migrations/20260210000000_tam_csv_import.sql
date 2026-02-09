-- Add csv_import to TAM source enums for CSV import feature
ALTER TYPE tam_company_source ADD VALUE IF NOT EXISTS 'csv_import';
ALTER TYPE tam_contact_source ADD VALUE IF NOT EXISTS 'csv_import';
