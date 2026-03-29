<?php

namespace App\Http\Controllers;

use App\Models\CategoryGroup;
use Illuminate\Http\JsonResponse;

class CategoriesController extends Controller
{
    public function index(): JsonResponse
    {
        $groups = CategoryGroup::query()
            ->where('is_active', true)
            ->with([
                'categories' => fn ($query) => $query
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('id'),
            ])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $data = $groups->map(fn (CategoryGroup $group) => [
            'id' => $group->id,
            'name' => $group->name,
            'categories' => $group->categories->map(fn ($category) => [
                'id' => $category->id,
                'groupId' => $category->group_id,
                'name' => $category->name,
            ])->values(),
        ])->values();

        return response()->json([
            'groups' => $data,
        ]);
    }
}
