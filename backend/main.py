from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from backend.services.auth_service import AuthException
from backend.routers.auth import router as auth_router

app = FastAPI(title="AI Career Platform API")

# Register custom exception handler for AuthException
@app.exception_handler(AuthException)
async def auth_exception_handler(request: Request, exc: AuthException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "status": exc.status_code
        }
    )

# Register custom exception handler for HTTPExceptions
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status": exc.status_code
        }
    )

# Register custom exception handler for Pydantic/FastAPI request validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    # Format a friendly error message from validation issues
    messages = []
    for err in errors:
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        messages.append(f"[{loc}]: {err.get('msg')}")
    combined_message = "Validation failed: " + ", ".join(messages)
    
    return JSONResponse(
        status_code=400,
        content={
            "error": True,
            "message": combined_message,
            "status": 400
        }
    )

# Include the authentication router
app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "Welcome to the AI Career Platform API. Authentication endpoints are active under /auth."}
