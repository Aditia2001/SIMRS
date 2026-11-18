<?php

return [
    'senderEmail' => 'noreply@example.com',
    'senderName' => 'SIMRS',
    'jwtSecret' => $_ENV['JWT_SECRET'] ?? '',
    'jwtExpiration' => (int) ($_ENV['JWT_EXPIRATION'] ?? 3600),
];