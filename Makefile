compose:
	docker compose -f docker-compose-dev.yaml up -d

compose-down:
	docker compose -f docker-compose-dev.yaml down