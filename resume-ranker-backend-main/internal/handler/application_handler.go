package handler

import (
	"encoding/json"
	"net/http"
	"resume-ranker/internal/service"
	"strings"
)


type ApplicationHandler struct{
	Service *service.ApplicationService
} 

func NewApplicationHandler(service *service.ApplicationService) *ApplicationHandler{
	return &ApplicationHandler{
		Service: service,
	}
}

func (h *ApplicationHandler) Apply(w http.ResponseWriter, r *http.Request){

	userID := r.Context().Value("user_id").(string)
	role := r.Context().Value("role").(string)

	var input struct{
		JobID string `json:"job_id"`
	}

	json.NewDecoder(r.Body).Decode(&input)

	err := h.Service.Apply(input.JobID,userID,role)

	if err != nil{
		http.Error(w,err.Error(),http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *ApplicationHandler) GetApplications(w http.ResponseWriter, r *http.Request){
	userID := r.Context().Value("user_id").(string)
	role := r.Context().Value("role").(string)

	apps, err := h.Service.GetApplications(userID,role)

	if err != nil{
		http.Error(w,err.Error(),http.StatusForbidden)
		return
	}

	json.NewEncoder(w).Encode(apps)
}

func (h *ApplicationHandler) PresignResumeUpload(w http.ResponseWriter, r *http.Request){
	candidateID := r.Context().Value("user_id").(string)
	role := r.Context().Value("role").(string)

	parts:= strings.Split(r.URL.Path,"/")
	if len(parts) < 5{
		http.Error(w,"INVALID URL",http.StatusBadRequest)
		return
	}
	
	applicationID := parts[2]

	if role != "candidate"{
		http.Error(w,"FORBIDDEN",http.StatusForbidden)
		return
	}

	uploadURL,s3Key, err := h.Service.PresignResumeUpload(r.Context(),applicationID,candidateID)

	if err != nil{
		http.Error(w,err.Error(),http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type","application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"upload_url": uploadURL,
        "s3_key":     s3Key,
	})

}

func (h *ApplicationHandler) ConfirmResumeUpload(w http.ResponseWriter,r *http.Request) {
	candidateID := r.Context().Value("user_id").(string)
	role := r.Context().Value("role").(string)

	if role != "candidate" {
		http.Error(w,"FORBIDDEN",http.StatusForbidden)
		return
	}

	parts := strings.Split(r.URL.Path,"/")
	if len(parts)<5{
		http.Error(w,"INVALID URL",http.StatusBadRequest)
		return
	}

	applicationID := parts[2]

	err := h.Service.ConfirmResumeUpload(r.Context(),applicationID,candidateID)
	if err!=nil{
		http.Error(w,err.Error(),http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message":"RESUME UPLOAD CONFIRM",
	})
}

func(h *ApplicationHandler) DownaloadResume(w http.ResponseWriter,r *http.Request){

	recruiterID := r.Context().Value("user_id").(string)
	role := r.Context().Value("role").(string)

	if role != "recruiter"{
		http.Error(w,"FORBIDDEN",http.StatusForbidden)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 5 {
		http.Error(w, "INVALID URL", http.StatusBadRequest)
		return
	}

	applicationID := parts[2]

	url, err := h.Service.GenerateResumeDownloadURL(r.Context(),applicationID,recruiterID)

	if err!=nil{
		http.Error(w,err.Error(),http.StatusForbidden)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"download_url": url,
	})
}