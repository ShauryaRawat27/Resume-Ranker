package db

import (
	"database/sql"
	"log"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func Connect() *sql.DB {
	database, err := sql.Open( //sql.open - prepares a conncn pool,not connecting yet
		"pgx",
		"postgres://localhost/resume_ranker?sslmode=disable",
	)

	if err != nil {
		log.Fatal("Failed to open DB:", err)
	}

	if err = database.Ping(); err != nil {
		log.Fatal("Failed to ping DB:", err)
	}

	return database //returns conncn pool object
}
