<?php

namespace App\Support;

use App\Models\PurchaseCandidate;
use App\Models\ShoppingMemo;
use App\Models\ShoppingMemoItem;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

class ShoppingMemoPayloadBuilder
{
    private const TOTAL_INCLUDED_STATUSES = [
        'considering',
        'on_hold',
    ];

    /**
     * @return array<string, mixed>
     */
    public static function buildSummary(ShoppingMemo $memo): array
    {
        $groups = self::buildGroups($memo);

        return [
            'id' => $memo->id,
            'name' => $memo->name,
            'memo' => $memo->memo,
            'status' => $memo->status,
            'item_count' => $memo->items->count(),
            'group_count' => count($groups),
            'subtotal' => array_sum(array_map(
                static fn (array $group): int => $group['subtotal'],
                $groups
            )),
            'has_price_unset' => in_array(true, array_map(
                static fn (array $group): bool => $group['has_price_unset'],
                $groups
            ), true),
            'nearest_deadline' => self::findNearestDeadline($groups),
            'created_at' => $memo->created_at?->toIso8601String(),
            'updated_at' => $memo->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function buildDetail(ShoppingMemo $memo): array
    {
        $groups = self::buildGroups($memo);

        return [
            ...self::buildSummary($memo),
            'groups' => $groups,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function buildGroups(ShoppingMemo $memo): array
    {
        /** @var array<int, array<string, mixed>> $bucketedGroups */
        $bucketedGroups = [];

        foreach ($memo->items as $item) {
            $candidate = $item->purchaseCandidate;

            if (! $candidate instanceof PurchaseCandidate) {
                continue;
            }

            $resolvedGroup = self::resolveGroup($candidate);

            if (! isset($bucketedGroups[$resolvedGroup['key']])) {
                $bucketedGroups[$resolvedGroup['key']] = [
                    'type' => $resolvedGroup['type'],
                    'key' => $resolvedGroup['key'],
                    'display_name' => $resolvedGroup['display_name'],
                    'subtotal' => 0,
                    'has_price_unset' => false,
                    'nearest_deadline' => null,
                    'items' => [],
                ];
            }

            $itemPayload = self::buildItemPayload($item, $candidate);
            $bucketedGroups[$resolvedGroup['key']]['items'][] = $itemPayload;

            if ($itemPayload['is_total_included'] && $itemPayload['line_total'] !== null) {
                $bucketedGroups[$resolvedGroup['key']]['subtotal'] += $itemPayload['line_total'];
            }

            if ($itemPayload['is_total_included'] && $itemPayload['unit_price'] === null) {
                $bucketedGroups[$resolvedGroup['key']]['has_price_unset'] = true;
            }

            if ($itemPayload['is_total_included']) {
                $bucketedGroups[$resolvedGroup['key']]['nearest_deadline'] = self::minDeadline(
                    $bucketedGroups[$resolvedGroup['key']]['nearest_deadline'],
                    self::resolveNearestItemDeadline($candidate),
                );
            }
        }

        $groups = array_values($bucketedGroups);

        usort($groups, static function (array $left, array $right): int {
            $typeOrder = [
                'domain' => 0,
                'brand' => 1,
                'uncategorized' => 2,
            ];

            $leftTypeOrder = $typeOrder[$left['type']] ?? 99;
            $rightTypeOrder = $typeOrder[$right['type']] ?? 99;

            if ($leftTypeOrder !== $rightTypeOrder) {
                return $leftTypeOrder <=> $rightTypeOrder;
            }

            return mb_strtolower((string) $left['display_name']) <=> mb_strtolower((string) $right['display_name']);
        });

        return array_map(static function (array $group): array {
            $group['nearest_deadline'] = $group['nearest_deadline'] instanceof CarbonInterface
                ? $group['nearest_deadline']->toIso8601String()
                : null;

            return $group;
        }, $groups);
    }

    /**
     * @return array{type: string, key: string, display_name: string}
     */
    private static function resolveGroup(PurchaseCandidate $candidate): array
    {
        $host = self::extractNormalizedHost($candidate->purchase_url);

        if ($host !== null) {
            return [
                'type' => 'domain',
                'key' => sprintf('domain:%s', $host),
                'display_name' => $host,
            ];
        }

        $brandName = trim((string) ($candidate->brand_name ?? ''));

        if ($brandName !== '') {
            return [
                'type' => 'brand',
                'key' => sprintf('brand:%s', mb_strtolower($brandName)),
                'display_name' => $brandName,
            ];
        }

        return [
            'type' => 'uncategorized',
            'key' => 'uncategorized',
            'display_name' => '未分類',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function buildItemPayload(ShoppingMemoItem $item, PurchaseCandidate $candidate): array
    {
        $unitPrice = self::resolveUnitPrice($candidate);
        $isTotalIncluded = in_array($candidate->status, self::TOTAL_INCLUDED_STATUSES, true);
        $lineTotal = ($isTotalIncluded && $unitPrice !== null)
            ? $unitPrice * (int) $item->quantity
            : null;

        return [
            'shopping_memo_item_id' => $item->id,
            'purchase_candidate_id' => $candidate->id,
            'name' => $candidate->name,
            'brand' => $candidate->brand_name,
            'purchase_url' => $candidate->purchase_url,
            'status' => $candidate->status,
            'price' => $candidate->price,
            'sale_price' => $candidate->sale_price,
            'unit_price' => $unitPrice,
            'quantity' => $item->quantity,
            'line_total' => $lineTotal,
            'is_total_included' => $isTotalIncluded,
            'sale_ends_at' => $candidate->sale_ends_at?->toIso8601String(),
            'discount_ends_at' => $candidate->discount_ends_at?->toIso8601String(),
            'memo' => $item->memo,
            'priority' => $item->priority,
            'sort_order' => $item->sort_order,
        ];
    }

    private static function resolveUnitPrice(PurchaseCandidate $candidate): ?int
    {
        if ($candidate->sale_price !== null) {
            return (int) $candidate->sale_price;
        }

        if ($candidate->price !== null) {
            return (int) $candidate->price;
        }

        return null;
    }

    private static function extractNormalizedHost(?string $url): ?string
    {
        $normalizedUrl = trim((string) $url);

        if ($normalizedUrl === '') {
            return null;
        }

        $host = parse_url($normalizedUrl, PHP_URL_HOST);

        if (! is_string($host) || $host === '') {
            return null;
        }

        $host = mb_strtolower($host);

        if (str_starts_with($host, 'www.')) {
            $host = substr($host, 4);
        }

        return $host !== '' ? $host : null;
    }

    private static function resolveNearestItemDeadline(PurchaseCandidate $candidate): ?CarbonInterface
    {
        return self::minDeadline(
            $candidate->sale_ends_at,
            $candidate->discount_ends_at,
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $groups
     */
    private static function findNearestDeadline(array $groups): ?string
    {
        $nearest = null;

        foreach ($groups as $group) {
            $nearest = self::minDeadline(
                $nearest,
                isset($group['nearest_deadline']) && is_string($group['nearest_deadline'])
                    ? Carbon::parse($group['nearest_deadline'])
                    : null,
            );
        }

        return $nearest?->toIso8601String();
    }

    private static function minDeadline(?CarbonInterface $left, ?CarbonInterface $right): ?CarbonInterface
    {
        if ($left === null) {
            return $right;
        }

        if ($right === null) {
            return $left;
        }

        return $left->lessThanOrEqualTo($right) ? $left : $right;
    }
}
