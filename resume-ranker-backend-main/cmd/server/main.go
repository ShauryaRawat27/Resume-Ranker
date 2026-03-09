package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"resume-ranker/internal/db"
	"resume-ranker/internal/handler"
	"resume-ranker/internal/middleware"
	"resume-ranker/internal/repository"
	"resume-ranker/internal/s3"

	// "resume-ranker/internal/s3"
	"resume-ranker/internal/service"
)




func main() {
jwtSecret := []byte(os.Getenv("JWT_SECRET"))
s3Client := s3.Init()

	database := db.Connect() //returns *sql.DB ie conncn pool
	userRepo := repository.NewUserRepository(database)

	jobRepo := repository.NewJobRepository(database)
	jobService := service.NewJobService(jobRepo)
	jobHandler := handler.NewJobHandler(jobService)

	

	// s3Client := s3.Init()
	// appService := service.NewApplicationService(appRepo,jobRepo,s3Client)

	authService := service.NewAuthService(userRepo, jwtSecret)
	authHandler := handler.NewAuthHandler(authService)
	
	mux := http.NewServeMux()

	mux.HandleFunc("/health",handler.HealthHandler)

	mux.HandleFunc("/auth/signup",authHandler.Signup)
	mux.HandleFunc("/auth/login",authHandler.Login)

	mux.HandleFunc("/jobs",middleware.Auth(jwtSecret)(func(w http.ResponseWriter,r *http.Request){
		if r.Method == http.MethodGet{
			jobHandler.GetJobs(w,r)
			return
		}
		if r.Method == http.MethodPost{
			jobHandler.CreateJob(w,r)
			return
		}
		http.Error(w,"METHOD NOT ALLOWED",http.StatusMethodNotAllowed)

	}),)

	appRepo := repository.NewApplicationRepository(database)
	appService := service.NewApplicationService(appRepo,s3Client)
	appHandler := handler.NewApplicationHandler(appService)

// 	mux.HandleFunc(
// 	"/applications",
// 	middleware.Auth(jwtSecret)(
// 		func(w http.ResponseWriter, r *http.Request) {

// 			// Exact match: /applications
// 			if r.URL.Path == "/applications" {

// 				if r.Method == http.MethodPost {
// 					appHandler.Apply(w, r)
// 					return
// 				}

// 				if r.Method == http.MethodGet {
// 					appHandler.GetApplications(w, r)
// 					return
// 				}
// 			}

// 			// Resume presign
// 			if r.Method == http.MethodPost &&
// 				strings.HasSuffix(r.URL.Path, "/resume/presign") {

// 				appHandler.PresignResumeUpload(w, r)
// 				return
// 			}

// 			// Resume confirm
// 			if r.Method == http.MethodPost &&
// 				strings.HasSuffix(r.URL.Path, "/resume/confirm") {

// 				appHandler.ConfirmResumeUpload(w, r)
// 				return
// 			}

// 			// // Resume download
// 			// if r.Method == http.MethodGet &&
// 			// 	strings.HasSuffix(r.URL.Path, "/resume/download") {

// 			// 	appHandler.DownloadResume(w, r)
// 			// 	return
// 			// }

// 			http.Error(w, "METHOD NOT ALLOWED", http.StatusMethodNotAllowed)
// 		},
// 	),
// )

mux.HandleFunc("/applications", middleware.Auth(jwtSecret)(func(w http.ResponseWriter, r *http.Request) {

	if r.URL.Path == "/applications" {
		if r.Method == http.MethodPost {
			appHandler.Apply(w, r)
			return
		}
		if r.Method == http.MethodGet {
			appHandler.GetApplications(w, r)
			return
		}
	}

	http.Error(w, "METHOD NOT ALLOWED", http.StatusMethodNotAllowed)
}))

mux.HandleFunc("/applications/", middleware.Auth(jwtSecret)(func(w http.ResponseWriter, r *http.Request) {

	if r.Method == http.MethodPost &&
		strings.HasSuffix(r.URL.Path, "/resume/presign") {

		appHandler.PresignResumeUpload(w, r)
		return
	}

	if r.Method == http.MethodPost &&
		strings.HasSuffix(r.URL.Path, "/resume/confirm") {

		appHandler.ConfirmResumeUpload(w, r)
		return
	}

	if r.Method == http.MethodGet &&
		strings.HasSuffix(r.URL.Path,"/resume/download"){
			appHandler.DownaloadResume(w,r)
			return
		}

	http.Error(w, "METHOD NOT ALLOWED", http.StatusMethodNotAllowed)
}))

	log.Println("SERVER RUNNING ON :8080")
	http.ListenAndServe(":8080",mux)
}

//Here we are creating a custom router mux 