# Quick Fix: Enable pgvector Extension

## The Problem

Error: `type "vector" does not exist`

This means the pgvector extension is not enabled in your PostgreSQL database.

## Quick Solution

### Option 1: Run the Script (Easiest)

```powershell
cd backend
npm run enable-pgvector
```

This will:
- Check if pgvector is installed
- Enable it if not already enabled
- Tell you if there are any issues

### Option 2: Manual SQL Command

Connect to your database using `psql` or any PostgreSQL client:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

To verify it worked:
```sql
\dx
```

You should see `vector` in the list.

### Option 3: If pgvector is Not Installed

If you get an error that pgvector is not installed, you have two options:

#### A. Install pgvector (Windows)

See `INSTALL_PGVECTOR.md` for detailed instructions. Quick version:

1. Install Visual Studio Build Tools (C++ support)
2. Open "x64 Native Tools Command Prompt for VS" as Administrator
3. Run:
   ```cmd
   set "PGROOT=C:\Program Files\PostgreSQL\17"
   cd %TEMP%
   git clone https://github.com/pgvector/pgvector.git
   cd pgvector
   nmake /F Makefile.win
   nmake /F Makefile.win install
   ```
4. Restart PostgreSQL service
5. Run: `CREATE EXTENSION vector;`

#### B. Use Docker (Easier)

If building is too complex, use Docker:

```powershell
docker run -d `
  --name postgres-pgvector `
  -p 5432:5432 `
  -e POSTGRES_PASSWORD=yourpassword `
  -e POSTGRES_DB=event-photo-management-local-db `
  ankane/pgvector
```

Then update your `.env` file:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event-photo-management-local-db
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
```

## Verify It Works

After enabling, try uploading a photo again. You should see:
- ✅ Photo uploaded to Google Drive
- ✅ Face embeddings created in database
- ✅ No more "type vector does not exist" error

## Check Database

You can verify embeddings were created:

```sql
SELECT 
    ei.file_name,
    COUNT(fe.id) as face_count
FROM event_images ei
LEFT JOIN face_embeddings fe ON fe.event_image_id = ei.id
GROUP BY ei.id, ei.file_name
ORDER BY ei.uploaded_at DESC;
```

