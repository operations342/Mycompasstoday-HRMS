#!/bin/bash

echo "⏳ Checking database connection readiness..."

# Run a lightweight PHP loop to wait for the database to become online
php -r '
$dbReady = false;
for ($i = 0; $i < 30; $i++) {
    try {
        require "vendor/autoload.php";
        $app = require_once "bootstrap/app.php";
        $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();
        
        // Try getting connection PDO
        Illuminate\Support\Facades\DB::connection()->getPdo();
        $dbReady = true;
        break;
    } catch (\Exception $e) {
        echo "Waiting for PostgreSQL database to start... (" . $e->getMessage() . ")\n";
        sleep(3);
    }
}
if (!$dbReady) {
    exit(1);
}
'

if [ $? -eq 0 ]; then
    echo "✅ Database is ready! Running migrations..."
    php artisan migrate --force
    echo "🌱 Seeding default datasets..."
    php artisan db:seed --force
else
    echo "❌ Database connection timed out. Skipping migrations."
fi

echo "🚀 Starting Web Server..."
exec apache2-foreground
