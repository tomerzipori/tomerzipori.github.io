PYTHON ?= python3

.PHONY: check new-note new-article new-experiment clean

check:
	$(PYTHON) scripts/build_content.py --check
	@echo "Content contract passed. Install Quarto to run: quarto render"

new-note:
	$(PYTHON) scripts/scaffold_content.py note "$(TITLE)"

new-article:
	$(PYTHON) scripts/scaffold_content.py article "$(TITLE)"

new-experiment:
	$(PYTHON) scripts/scaffold_content.py experiment "$(TITLE)"

clean:
	rm -rf _site _generated .quarto
