# 🚀 Quick Start Guide - Validation Engine

## Prerequisites
- Python 3.8+
- Node.js 18+
- Redis/Valkey running
- AWS account with Rekognition access

## Installation Steps

### 1️⃣ Setup Python Validation Engine

```powershell
# Navigate to validator engine
cd apps\validator_engine

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials:
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - AWS_REGION
# - AWS_S3_BUCKET
# - REDIS_URL
# - BACKEND_URL
```

### 2️⃣ Setup BullMQ Worker

```powershell
# Navigate to worker cluster
cd apps\worker_cluster

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with:
# - REDIS_1=redis://localhost:6379
# - PYTHON_VALIDATION_URL=http://localhost:8000
# - BACKEND_URL=http://localhost:3000
```

### 3️⃣ Start Services

**Terminal 1 - Redis (if not running as service):**
```powershell
redis-server
```

**Terminal 2 - Python Validation Engine:**
```powershell
cd apps\validator_engine
.\venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 - Node.js Backend:**
```powershell
cd apps\web
npm run dev
```

**Terminal 4 - BullMQ Worker:**
```powershell
cd apps\worker_cluster
node index.js
```

## Testing the Flow

### Option 1: Via API

```bash
# Create a submission
POST http://localhost:3000/api/submission
Headers:
  token: <your_user_token>
  Content-Type: application/json

Body: {
  "loanId": "6936ee676905b8dbaa9800a5",
  "submissionType": "INITIAL",
  "media": [...],
  "deviceInfo": {...},
  "captureContext": {...}
}
```

### Option 2: Via Mobile App

1. Open React Native app
2. Login as beneficiary
3. Navigate to loan details
4. Submit verification with photos/videos
5. Watch the validation happen!

## Monitoring

### Check Python Service Health
```bash
curl http://localhost:8000/
# Response: {"message": "Validation Engine Running"}
```

### Check Worker Status
Look at Terminal 4 logs:
- `🚀 Worker started. Listening for jobs on 'validationQueue'...`
- `👷 Processing validation job: <id>`
- `✅ Python validation completed`
- `✅ Submission updated`

### Check Validation Results
```bash
GET http://localhost:3000/api/submission
Headers:
  token: <your_user_token>
```

Look for `aiSummary` field in response:
```json
{
  "aiSummary": {
    "riskScore": 15,
    "decision": "AUTO_APPROVE",
    "flags": [],
    "features": {...}
  }
}
```

## Common Issues

### Issue: "Failed to download from S3"
**Solution:** Check your AWS credentials in `.env` and ensure S3 bucket is accessible

### Issue: "REDIS_URL connection failed"
**Solution:** Ensure Redis is running on the specified URL

### Issue: "Callback failed"
**Solution:** Check `BACKEND_URL` in Python service `.env` matches your Node.js server

### Issue: Worker not processing jobs
**Solution:** 
1. Check Redis connection in worker
2. Ensure queue name matches in both producer and worker (`validationQueue`)
3. Check worker logs for errors

## Environment Variables Checklist

### validator_engine/.env
- ✅ AWS_REGION
- ✅ AWS_ACCESS_KEY_ID
- ✅ AWS_SECRET_ACCESS_KEY
- ✅ AWS_S3_BUCKET
- ✅ REDIS_URL
- ✅ BACKEND_URL

### worker_cluster/.env
- ✅ REDIS_1
- ✅ PYTHON_VALIDATION_URL
- ✅ BACKEND_URL

## Next Steps

1. ✅ Test with real images
2. ✅ Monitor risk scores
3. ✅ Check ledger entries
4. ✅ Verify callback to backend
5. ✅ Test decision logic (AUTO_APPROVE, AUTO_REVIEW, etc.)

## Production Deployment

### Python Service
- Use Gunicorn/Uvicorn with multiple workers
- Set up health checks
- Configure proper logging
- Use environment-specific configs

### Worker
- Use PM2 for process management
- Set up monitoring
- Configure concurrency based on load
- Implement dead letter queue

### Redis
- Use managed Redis (AWS ElastiCache, Redis Cloud)
- Enable persistence
- Set up backups

---

🎉 **You're all set!** Create a submission and watch the magic happen! ✨
