import time
import random

FRONTEND_URL = "http://localhost:3050"
BACKEND_URL = "http://localhost:4050"

SEEDED_USERS = {
    # Member of proposal "Using AI at work" (has voted to start)
    "JAN_NOVAK": {
        "email": "jan.novak@example.com",
        "password": "passwordos",
        "name": "Jan Novák",
    },
    # Member of proposal "Using AI at work" (has voted to start)
    "PETRA_SVOBODOVA": {
        "email": "petra.svobodova@example.com",
        "password": "passwordos",
        "name": "Petra Svobodová",
    },
    # Member of proposal "Using AI at work" (has NOT voted yet)
    "TOMAS_DVORAK": {
        "email": "tomas.dvorak@example.com",
        "password": "passwordos",
        "name": "Tomáš Dvořák",
    },
    # Member of proposal "Using AI at work" (has NOT voted yet)
    "ONDREJ_MAREK": {
        "email": "ondrej.marek@example.com",
        "password": "passwordos",
        "name": "Ondřej Marek",
    },
    # Sole member of proposal "From Excel to Python" (1 of 5)
    "EVA_CERNA": {
        "email": "eva.cerna@example.com",
        "password": "passwordos",
        "name": "Eva Černá",
    },
    # Member of the active kvintet "Frontend craft circle"
    "ANNA_HORAKOVA": {
        "email": "anna.horakova@example.com",
        "password": "passwordos",
        "name": "Anna Horáková",
    },
    # Onboarded user in no kvintet
    "LENKA_MALA": {
        "email": "lenka.mala@example.com",
        "password": "passwordos",
        "name": "Lenka Malá",
    },
    # Onboarded user in no kvintet
    "NATHAN_NEMEC": {
        "email": "nathan.nemec@example.com",
        "password": "passwordos",
        "name": "Nathan Němec",
    },
    # Onboarded user in no kvintet
    "MARTIN_BAMBAS": {
        "email": "martin.bambas@example.com",
        "password": "passwordos",
        "name": "Martin Bambas",
    },
    # Superadmin
    "ADMIN": {
        "email": "admin@example.com",
        "password": "adminpassword",
        "name": "Admin",
    },
}

def generate_random_user(prefix="py-user"):
    unique = f"{int(time.time() * 1000)}-{random.randint(100, 999)}"
    return {
        "email": f"{prefix}-{unique}@example.com",
        "password": "Password123!",
        "name": f"User {unique}",
        "username": f"u{unique.replace('-', '')}",
    }

def generate_random_proposal(prefix="Python Kvintet"):
    unique = f"{int(time.time() * 1000)}"
    return {
        "title": f"{prefix} {unique}",
        "description": f"Automated Selenium test proposal description for {unique}.",
        "categories": ["data-ai", "software-development"],
    }
