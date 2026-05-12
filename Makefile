.PHONY: run-backend run-frontend run test

run-backend:
	cd backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --reload

run-frontend:
	cd frontend && npm run dev

run:
	@echo "Starting both services..."
	make -j 2 run-backend run-frontend

test-backend:
	cd backend && .\venv\Scripts\python.exe -m pytest tests/ -v

test-frontend:
	cd frontend && npm run test -- --run

test:
	@echo "Running all tests..."
	make -j 2 test-backend test-frontend
