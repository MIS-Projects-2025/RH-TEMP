<?php

$permission_sets = [
  'dashboard' => ['dashboard'],
];

$full_access = array_merge(
  $permission_sets['dashboard'],
);

return [
  'programmer 1' => $full_access,
];
