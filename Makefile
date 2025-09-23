.PHONY: install uninstall setup-ocr update run dev check_last_trial

ENV_NAME = sigilum

# --- Hardcoded experiment params for `make run`
CHEQUE        = data/cheques/cheque_test_01.png
CUENTA        = 001-123456/7
FIRMAS_DIR    = data/firmas
PIPELINE_CFG  = configs/pipeline_from_legacy.yaml
SEARCH_CFG    = configs/search_spaces.yaml
METRICS_CFG   = configs/metrics_profile.yaml
MODE          = both
LOG_LEVEL     = DEBUG

# Installation and setup
install:
	@echo "Creating conda environment..."
	conda env create -f environment.yml
	@echo "✅ Environment created successfully!"
	@echo "📋 Next steps:"
	@echo "   1. Run 'make setup-ocr' to install OCR support"
	@echo "   2. Run 'conda activate $(ENV_NAME)'"

setup-ocr:
	@echo "Setting up Tesseract OCR..."
	@echo "Detecting operating system..."
	@if [ "$$(uname)" = "Darwin" ]; then \
		echo "🍎 macOS detected - Installing via Homebrew..."; \
		if command -v brew >/dev/null 2>&1; then \
			brew install tesseract tesseract-lang; \
			echo "✅ Tesseract installed via Homebrew"; \
		else \
			echo "❌ Homebrew not found. Please install Homebrew first:"; \
			echo "   /bin/bash -c \"$$(/usr/bin/curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""; \
			echo "   Then run 'make setup-ocr' again"; \
			exit 1; \
		fi; \
	elif [ "$$(uname)" = "Linux" ]; then \
		echo "🐧 Linux detected - Installing via package manager..."; \
		if command -v apt-get >/dev/null 2>&1; then \
			sudo apt-get update && sudo apt-get install -y tesseract-ocr tesseract-ocr-eng tesseract-ocr-spa; \
			echo "✅ Tesseract installed via apt"; \
		elif command -v yum >/dev/null 2>&1; then \
			sudo yum install -y tesseract tesseract-langpack-eng tesseract-langpack-spa; \
			echo "✅ Tesseract installed via yum"; \
		else \
			echo "❌ No supported package manager found (apt/yum)"; \
			echo "   Please install Tesseract manually"; \
			exit 1; \
		fi; \
	else \
		echo "❓ Unknown OS. Please install Tesseract manually:"; \
		echo "   - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki"; \
		echo "   - Other: Check your package manager or build from source"; \
	fi
	@echo "🧪 Testing Tesseract installation..."
	@tesseract --version || (echo "❌ Tesseract test failed" && exit 1)
	@echo "✅ Tesseract setup complete!"

uninstall:
	@echo "Removing conda environment..."
	conda env remove -n $(ENV_NAME) -y
	@echo "✅ Environment removed"

update:
	@echo "📦 Updating environment..."
	conda env update -f environment.yml
	@echo "✅ Environment updated"

# --- Run the hardcoded experiment
run:
	@echo "▶️  Running Sigilum with hardcoded params..."
	conda run -n $(ENV_NAME) python main.py \
	  --cheque $(CHEQUE) \
	  --cuenta '$(CUENTA)' \
	  --firmas_dir $(FIRMAS_DIR) \
	  --pipeline_cfg $(PIPELINE_CFG) \
	  --search_cfg $(SEARCH_CFG) \
	  --metrics_cfg $(METRICS_CFG) \
	  --mode $(MODE) \
	  --log-level $(LOG_LEVEL)

# --- Start development dashboard
dev:
	@echo "🚀 Starting Sigilum Dashboard..."
	cd sigilum-dashboard && npm run dev

# --- Render HTML for the most recent run in ./runs
check_last_trial:
	@echo "🔎 Locating latest run in ./runs ..."
	@last=$$(ls -1dt runs/* 2>/dev/null | head -n 1); \
	if [ -z "$$last" ]; then echo "❌ No runs found in ./runs"; exit 1; fi; \
	echo "🧪 Last run: $$last"; \
	conda run -n $(ENV_NAME) python -m sigilum.reporting.html_report --run "$$last"; \
	echo "📄 Report: $$last/aggregate/report.html"; \
	( command -v open >/dev/null 2>&1 && open "$$last/aggregate/report.html" ) || \
	( command -v xdg-open >/dev/null 2>&1 && xdg-open "$$last/aggregate/report.html" ) || true
