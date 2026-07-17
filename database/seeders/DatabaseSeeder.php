<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Designation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

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
    }
}
