<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
  protected $connection = 'masterlist';
  protected $table = 'employee_masterlist';
  protected $primaryKey = 'EMPLOYID';
  public $timestamps = false;

  // protected $fillable = [
  //   'EMPLOYID',
  //   'EMPNAME',
  //   'JOB_TITLE',
  //   'DEPARTMENT',
  //   'PRODLINE',
  //   'STATION',
  //   'DATEHIRED',
  //   'EMAIL',
  //   'PASSWRD'
  // ];
}
