<?php

namespace App\Http\Controllers;

use App\Models\CategoryGroup;
use App\Support\ItemSubcategorySupport;
use Illuminate\Http\JsonResponse;

class CategoriesController extends Controller
{
    public function index(): JsonResponse
    {
        $currentGroupIds = ItemSubcategorySupport::currentGroupIds();
        $currentVisibleCategoryIds = ItemSubcategorySupport::currentVisibleCategoryIds();

        $groups = CategoryGroup::query()
            ->where('is_active', true)
            ->whereIn('id', $currentGroupIds)
            ->with([
                'categories' => fn ($query) => $query
                    ->where('is_active', true)
                    ->whereIn('id', $currentVisibleCategoryIds)
                    ->orderBy('sort_order')
                    ->orderBy('id'),
            ])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->filter(fn (CategoryGroup $group) => $group->categories->isNotEmpty())
            ->values();

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
