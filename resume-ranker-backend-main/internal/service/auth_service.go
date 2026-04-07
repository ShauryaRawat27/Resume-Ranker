package service

import (
	"fmt"
	"resume-ranker/internal/repository"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// var jwtSecret = []byte(os.Getenv("JWT_SECRET"))


type AuthService struct {
	UserRepo	*repository.UserRepository //to talk to DB
	JWTSecret	[]byte	//to sign tokens
}

func NewAuthService(userRepo *repository.UserRepository, secret []byte) *AuthService{
	return &AuthService{
		UserRepo: userRepo,
		JWTSecret: secret,
	}
} //creates an authservice struct, fills the data in it and returns a pointer to it


func (s *AuthService) Signup(email, password, role string) (string, error) { //This is a method
// func operates on authservice object and s represents the object
	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return "", err
	}

	userID := fmt.Sprintf("user-%d", time.Now().UnixNano())

	err = s.UserRepo.CreateUser(userID, email, string(hashedPassword), role)
	if err != nil {
		return "", err
	}

	return userID, nil
}

func(s *AuthService) Login(email,password string) (string,string,error){
	id, hashedPassword, role, err := s.UserRepo.FindByEmail(email)

	if err != nil{
		return "","",err
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(hashedPassword),
		[]byte(password),
	)

	if err!=nil{
		return "","",err
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256,jwt.MapClaims{
		"user_id":id,
		"role": role,
		"exp": time.Now().Add(24 * time.Hour).Unix(), //expiry
	})

	signedToken, err := token.SignedString(s.JWTSecret)
	if err != nil {
		return "","",err
	}

	return signedToken, role, nil
}	
