<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Designation;
use App\Models\Subscription;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $password = Hash::make('password');

        // Initial designation roles
        $rolesList = [
            'Senior Developer',
            'Operation manager',
            'Social media Manager',
            'Backend Operator',
            'Backend Head',
            'Researcher',
            'Content Creator',
            'Accountant'
        ];

        $designations = [];
        foreach ($rolesList as $rName) {
            $designations[$rName] = Designation::firstOrCreate(['name' => $rName]);
        }

        // Create main Super Admin user (Preserving your profile details)
        User::firstOrCreate(
            ['email' => 'superadmin@mycompass.com'],
            [
                'name' => 'Jay Rathod',
                'password' => $password,
                'role' => 'Super Admin',
                'department' => 'HR',
                'phone' => '8530557587',
                'designation_id' => $designations['Operation manager']->id,
            ]
        );

        // Seed sample Subscriptions for UI demonstration & popup alerts testing
        Subscription::firstOrCreate(
            ['name' => 'ABC School'],
            [
                'plan' => 'Premium Plus',
                'type' => 'Yearly',
                'amount' => 15000.00,
                'start_date' => Carbon::now()->subYear()->addDays(2),
                'end_date' => Carbon::now()->addDays(2), // Expiry in 2 days (Trigger warning popup)
                'users_count' => 120,
                'notes' => 'Maths and Science curriculum client.',
                'status' => 'Expiring Soon',
            ]
        );

        Subscription::firstOrCreate(
            ['name' => 'XYZ International School'],
            [
                'plan' => 'Gold Plan',
                'type' => 'Yearly',
                'amount' => 12000.00,
                'start_date' => Carbon::now()->subYear()->addDays(3),
                'end_date' => Carbon::now()->addDays(3), // Expiry in 3 days (Trigger orange alert)
                'users_count' => 85,
                'notes' => 'Regular campaign client.',
                'status' => 'Expiring Soon',
            ]
        );

        Subscription::firstOrCreate(
            ['name' => 'Oakwood Academy'],
            [
                'plan' => 'Basic Package',
                'type' => 'Monthly',
                'amount' => 1500.00,
                'start_date' => Carbon::now()->subMonth()->subDay(),
                'end_date' => Carbon::now()->subDay(), // Expired 1 day ago (Trigger expired popup)
                'users_count' => 25,
                'notes' => 'Trial account expired yesterday.',
                'status' => 'Expired',
            ]
        );

        Subscription::firstOrCreate(
            ['name' => 'Global Heights School'],
            [
                'plan' => 'Platinum Elite',
                'type' => 'Yearly',
                'amount' => 25000.00,
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addYear(), // Active (>30 days left - Green indicator)
                'users_count' => 250,
                'notes' => 'High profile client with dedicated manager support.',
                'status' => 'Active',
            ]
        );

        Subscription::firstOrCreate(
            ['name' => 'Apex Learning Centre'],
            [
                'plan' => 'Standard Pack',
                'type' => 'Monthly',
                'amount' => 1200.00,
                'start_date' => Carbon::now()->subDays(15),
                'end_date' => Carbon::now()->addDays(15), // Yellow indicator (15 days left)
                'users_count' => 10,
                'notes' => 'Requires follow-up calls next week.',
                'status' => 'Expiring Soon',
            ]
        );

        Subscription::firstOrCreate(
            ['name' => 'St. Marys High School'],
            [
                'plan' => 'Standard Pack',
                'type' => 'Quarterly',
                'amount' => 4500.00,
                'start_date' => Carbon::now()->subMonths(2),
                'end_date' => Carbon::now()->addMonth(), // Active (>30 days left - Green indicator)
                'users_count' => 50,
                'notes' => 'Secondary level client.',
                'status' => 'Active',
            ]
        );
    }
}
