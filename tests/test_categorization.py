import pytest
from app.services.categorization import _keyword_classify
from app.models.complaint import Category, Severity


def test_road_category():
    category, _ = _keyword_classify("There is a huge pothole on the main road near my house")
    assert category == Category.road


def test_water_category():
    category, _ = _keyword_classify("Water pipe is leaking and flooding the street")
    assert category == Category.water


def test_electricity_category():
    category, _ = _keyword_classify("Power outage in our area since last night, transformer is burnt")
    assert category == Category.electricity


def test_p1_severity():
    _, severity = _keyword_classify("Emergency! Building collapse, people are injured, urgent help needed")
    assert severity == Severity.P1


def test_p4_severity():
    _, severity = _keyword_classify("The street light near my house is a bit dim")
    assert severity == Severity.P4


def test_fallback_other():
    category, severity = _keyword_classify("Something strange is happening")
    assert category == Category.other
    assert severity == Severity.P4
