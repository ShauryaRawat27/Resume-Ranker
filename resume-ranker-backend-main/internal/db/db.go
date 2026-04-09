package db

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func Connect() *sql.DB {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://localhost/resume_ranker?sslmode=disable"
	}

	database, err := sql.Open( //sql.open - prepares a conncn pool,not connecting yet
		"pgx",
		dsn,
	)

	if err != nil {
		log.Fatal("Failed to open DB:", err)
	}

	if err = database.Ping(); err != nil {
		log.Fatal("Failed to ping DB:", err)
	}

	return database //returns conncn pool object
}
