# Installing pgvector on Windows

The pgvector extension is required for vector similarity search features. Since there are no pre-built Windows binaries, you need to build it from source.

## Prerequisites

1. **Visual Studio** with C++ support, OR
2. **Visual Studio Build Tools** (lighter option)
   - Download from: https://visualstudio.microsoft.com/downloads/
   - Select "Desktop development with C++" workload

2. **Git** (if not already installed)
   - Download from: https://git-scm.com/download/win

3. **PostgreSQL 17** (already installed)

## Installation Steps

### Step 1: Open Developer Command Prompt

1. Press `Windows Key` and search for "x64 Native Tools Command Prompt for VS"
2. **Right-click** and select **"Run as administrator"**

### Step 2: Set PostgreSQL Path

In the command prompt, set the PostgreSQL root directory:

```cmd
set "PGROOT=C:\Program Files\PostgreSQL\17"
```

**Note:** Adjust the version number if you have a different PostgreSQL version.

### Step 3: Clone and Build pgvector

```cmd
cd %TEMP%
git clone https://github.com/pgvector/pgvector.git
cd pgvector
nmake /F Makefile.win
nmake /F Makefile.win install
```

### Step 4: Restart PostgreSQL Service

1. Open **Services** (search for "services" in Windows)
2. Find **"postgresql-x64-17"** (or similar)
3. Right-click and select **"Restart"**

### Step 5: Enable Extension in Database

Connect to your database using `psql` or any PostgreSQL client:

```sql
CREATE EXTENSION vector;
```

To verify it's installed:

```sql
\dx
```

You should see `vector` in the list of extensions.

## Alternative: Using Docker

If building from source is too complex, you can use a PostgreSQL Docker image with pgvector pre-installed:

```bash
docker run -d \
  --name postgres-pgvector \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=event-photo-management-local-db \
  ankane/pgvector
```

Then update your `.env` file to point to this Docker container.

## Troubleshooting

### "nmake is not recognized"
- Make sure you're using the "x64 Native Tools Command Prompt for VS"
- Not the regular Command Prompt or PowerShell

### "Cannot find PostgreSQL"
- Verify PostgreSQL is installed at: `C:\Program Files\PostgreSQL\17`
- Adjust the `PGROOT` path if it's in a different location

### "Permission denied" during install
- Make sure you're running the command prompt as Administrator

### Extension still not found after installation
- Restart the PostgreSQL service
- Verify files are in: `C:\Program Files\PostgreSQL\17\share\extension\`
- Check that `vector.control` and `vector--*.sql` files exist there

## Development Mode

If you don't need vector features immediately, the migration system will automatically:
- Skip the vector extension
- Create VECTOR columns as TEXT instead
- Allow the server to start normally

You can install pgvector later and the migration will handle it automatically.

