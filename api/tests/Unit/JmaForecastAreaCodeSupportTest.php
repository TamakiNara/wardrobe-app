<?php

namespace Tests\Unit;

use App\Support\JmaForecastAreaCodeSupport;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\TestCase;

class JmaForecastAreaCodeSupportTest extends TestCase
{
    public function test_it_derives_office_code_from_region_code(): void
    {
        $this->assertSame('110000', JmaForecastAreaCodeSupport::deriveOfficeCodeFromRegionCode('110010'));
        $this->assertSame('270000', JmaForecastAreaCodeSupport::deriveOfficeCodeFromRegionCode('270000'));
    }

    public function test_it_accepts_matching_region_and_office_codes(): void
    {
        JmaForecastAreaCodeSupport::validateRegionOfficePair('130010', '130000');

        $this->assertTrue(true);
    }

    public function test_it_rejects_mismatched_region_and_office_codes(): void
    {
        $this->expectException(ValidationException::class);

        JmaForecastAreaCodeSupport::validateRegionOfficePair('130010', '110000');
    }
}
