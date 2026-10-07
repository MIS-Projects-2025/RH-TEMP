# 📘 Project Setup Guide

A quickstart guide to install and run the application locally.

---

## 📦 Install Dependencies

### 1. Composer

```bash
composer install
```

### 2. NPM

```bash
npm install
```

---

## ⚙️ Environment Setup

Copy the example environment file and set the required variables (duplicate and rename or by terminal):

```bash
cp .env.example .env
```

Then generate the application key:

```bash
php artisan key:generate
```

---

## 🗃️ Database

Make sure the following table exists in your database:

- `admin`

Note: locate the System_Tables.sql from the root level of the template and copy and create the admin table in your database

---

## ✅ Done

You’re now ready to start the application!

```bash
composer run dev
```

---


## Debug
```
C:\Users\telford.programmer>

curl -i "http://192.168.20.21:8005/proxy/192.168.1.199/postReadHtml?a"
```

HTTP/1.1 200 OK
Server: nginx/1.28.2
Date: Wed, 07 Oct 2026 06:58:00 GMT
Transfer-Encoding: chunked
Connection: keep-alive
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS

a 2026 10 7 15 0 8
b Temperature 23.1 C
c Humidity 55.3 %
i Alarm Relay1 OFF
j Alarm Relay2 OFF
m Recording ON