package repository

import "database/sql"


type UserRepository struct{
	DB *sql.DB //container that holds the database
}

func NewUserRepository(database *sql.DB) *UserRepository{
	return &UserRepository{
		DB : database,
	}
}

//providing userrepo the db conncn to perform queries



func (r *UserRepository) CreateUser(id, email, password, role string) error {
	_, err := r.DB.Exec(
		`INSERT INTO users (id, email, password, role)
		 VALUES ($1, $2, $3, $4)`,
		id, email, password, role,
	)
	return err
}

func (r *UserRepository) FindByEmail(email string) (string, string, string, error) {
	var id, password, role string

	err := r.DB.QueryRow(
		`SELECT id, password, role FROM users WHERE email = $1`,
		email,
	).Scan(&id, &password, &role)

	return id, password, role, err
}