<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    protected function successResponse($message, $data = null, $code = 200)
    {
        return response()->json([
            'status'  => 'success',
            'message' => $message,
            'data'    => $data,
        ], $code);
    }

    protected function errorResponse($message, $code = 400, $data = null)
    {
        return response()->json([
            'status'  => 'error',
            'message' => $message,
            'data'    => $data,
        ], $code);
    }
}
