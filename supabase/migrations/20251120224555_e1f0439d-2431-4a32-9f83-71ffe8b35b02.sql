-- Delete auth.users entries for test accounts that no longer have profiles
DELETE FROM auth.users 
WHERE email IN ('testman@test.com', 'testeeer@test.com', 'testonce@test.com', 'test@test.com');