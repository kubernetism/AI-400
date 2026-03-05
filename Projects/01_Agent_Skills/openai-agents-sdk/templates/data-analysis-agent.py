"""
Data Analysis Agent Template

Production-ready agent for data analysis tasks with:
- SQL query generation
- Data visualization
- Insight extraction
- Report generation
"""

import asyncio
import json
from typing import Any
from pydantic import BaseModel, Field
from agents import Agent, Runner, function_tool
from agents.tracing import custom_span


# =============================================================================
# Configuration
# =============================================================================

class Config:
    MODEL = "gpt-5.2"
    MAX_QUERY_ROWS = 1000
    SUPPORTED_DATABASES = ["postgresql", "mysql", "sqlite"]


# =============================================================================
# Output Types
# =============================================================================

class SQLQuery(BaseModel):
    """Generated SQL query with explanation."""
    query: str = Field(description="The SQL query to execute")
    explanation: str = Field(description="Explanation of what the query does")
    expected_columns: list[str] = Field(description="Expected column names in result")


class DataInsight(BaseModel):
    """An insight extracted from data."""
    title: str = Field(description="Short title for the insight")
    description: str = Field(description="Detailed description of the insight")
    confidence: str = Field(description="Confidence level: high, medium, low")
    supporting_data: str = Field(description="Data points supporting this insight")


class AnalysisReport(BaseModel):
    """Complete analysis report."""
    summary: str = Field(description="Executive summary of findings")
    insights: list[DataInsight] = Field(description="Key insights discovered")
    recommendations: list[str] = Field(description="Actionable recommendations")
    methodology: str = Field(description="Brief description of analysis approach")


# =============================================================================
# Database Schema Context
# =============================================================================

DATABASE_SCHEMA = """
## Available Tables

### customers
- customer_id (INT, PRIMARY KEY)
- name (VARCHAR)
- email (VARCHAR)
- created_at (TIMESTAMP)
- segment (VARCHAR) - values: 'enterprise', 'small_business', 'individual'

### orders
- order_id (INT, PRIMARY KEY)
- customer_id (INT, FOREIGN KEY -> customers)
- order_date (DATE)
- total_amount (DECIMAL)
- status (VARCHAR) - values: 'pending', 'completed', 'cancelled', 'refunded'

### products
- product_id (INT, PRIMARY KEY)
- name (VARCHAR)
- category (VARCHAR)
- price (DECIMAL)
- stock_quantity (INT)

### order_items
- item_id (INT, PRIMARY KEY)
- order_id (INT, FOREIGN KEY -> orders)
- product_id (INT, FOREIGN KEY -> products)
- quantity (INT)
- unit_price (DECIMAL)
"""


# =============================================================================
# Tools
# =============================================================================

@function_tool
async def execute_sql_query(query: str) -> dict:
    """Execute a SQL query and return results.

    Args:
        query: SQL query to execute (SELECT only for safety)
    """
    # Validate query is SELECT only
    query_lower = query.strip().lower()
    if not query_lower.startswith("select"):
        return {
            "success": False,
            "error": "Only SELECT queries are allowed",
            "data": None,
        }

    # In production, this would execute against your database
    # Here we return mock data
    with custom_span("sql_execution", {"query_preview": query[:100]}):
        # Simulate query execution
        await asyncio.sleep(0.1)

        # Mock result based on query content
        if "count" in query_lower:
            return {
                "success": True,
                "data": [{"count": 1234}],
                "row_count": 1,
                "columns": ["count"],
            }
        elif "sum" in query_lower or "total" in query_lower:
            return {
                "success": True,
                "data": [{"total": 125000.50}],
                "row_count": 1,
                "columns": ["total"],
            }
        else:
            return {
                "success": True,
                "data": [
                    {"id": 1, "value": 100},
                    {"id": 2, "value": 200},
                    {"id": 3, "value": 150},
                ],
                "row_count": 3,
                "columns": ["id", "value"],
            }


@function_tool
async def get_table_schema(table_name: str) -> dict:
    """Get the schema for a specific table.

    Args:
        table_name: Name of the table to describe
    """
    schemas = {
        "customers": {
            "columns": [
                {"name": "customer_id", "type": "INT", "key": "PRIMARY"},
                {"name": "name", "type": "VARCHAR(255)"},
                {"name": "email", "type": "VARCHAR(255)"},
                {"name": "created_at", "type": "TIMESTAMP"},
                {"name": "segment", "type": "VARCHAR(50)"},
            ],
            "row_count": 15000,
        },
        "orders": {
            "columns": [
                {"name": "order_id", "type": "INT", "key": "PRIMARY"},
                {"name": "customer_id", "type": "INT", "key": "FOREIGN"},
                {"name": "order_date", "type": "DATE"},
                {"name": "total_amount", "type": "DECIMAL(10,2)"},
                {"name": "status", "type": "VARCHAR(20)"},
            ],
            "row_count": 50000,
        },
        "products": {
            "columns": [
                {"name": "product_id", "type": "INT", "key": "PRIMARY"},
                {"name": "name", "type": "VARCHAR(255)"},
                {"name": "category", "type": "VARCHAR(100)"},
                {"name": "price", "type": "DECIMAL(10,2)"},
                {"name": "stock_quantity", "type": "INT"},
            ],
            "row_count": 500,
        },
    }

    return schemas.get(table_name, {"error": f"Table '{table_name}' not found"})


@function_tool
async def create_visualization(
    chart_type: str,
    data: list[dict],
    title: str,
    x_axis: str,
    y_axis: str,
) -> dict:
    """Create a data visualization.

    Args:
        chart_type: Type of chart (bar, line, pie, scatter)
        data: Data to visualize
        title: Chart title
        x_axis: X-axis label
        y_axis: Y-axis label
    """
    # In production, this would generate actual visualizations
    return {
        "success": True,
        "chart_id": f"chart_{hash(title) % 10000}",
        "chart_type": chart_type,
        "title": title,
        "message": f"Created {chart_type} chart: {title}",
        "preview_url": f"https://charts.example.com/preview/{hash(title) % 10000}",
    }


@function_tool
async def save_analysis_report(
    report_name: str,
    content: str,
    format: str = "markdown",
) -> dict:
    """Save an analysis report.

    Args:
        report_name: Name for the report
        content: Report content
        format: Output format (markdown, html, pdf)
    """
    # In production, this would save to a file or document store
    return {
        "success": True,
        "report_id": f"report_{hash(report_name) % 10000}",
        "file_path": f"/reports/{report_name}.{format}",
        "message": f"Report saved: {report_name}",
    }


# =============================================================================
# Agents
# =============================================================================

# SQL Query Generator Agent
sql_agent = Agent(
    name="SQL Expert",
    handoff_description="Expert at writing SQL queries for data analysis",
    instructions=f"""You are a SQL expert. Generate accurate, efficient SQL queries.

DATABASE SCHEMA:
{DATABASE_SCHEMA}

Guidelines:
- Always use proper JOIN syntax
- Include appropriate WHERE clauses
- Use aggregations (COUNT, SUM, AVG) when summarizing
- Add ORDER BY for ranked results
- Use LIMIT to prevent large result sets
- Alias complex expressions for clarity
- Consider query performance (use indexes)

Safety rules:
- Only generate SELECT queries
- Never use DELETE, UPDATE, INSERT, DROP
- Limit results to {Config.MAX_QUERY_ROWS} rows max
""",
    model=Config.MODEL,
    tools=[execute_sql_query, get_table_schema],
)

# Insight Extraction Agent
insight_agent = Agent(
    name="Data Analyst",
    handoff_description="Expert at extracting insights from data",
    instructions="""You are a data analyst expert. Extract meaningful insights from data.

When analyzing data:
1. Look for patterns and trends
2. Identify anomalies and outliers
3. Compare segments and groups
4. Calculate key metrics (growth rates, ratios, etc.)
5. Consider statistical significance

For each insight:
- Provide clear, actionable title
- Explain the "so what" - why does this matter?
- Support with specific numbers
- Rate your confidence level honestly

Avoid:
- Overstating conclusions
- Correlation vs causation confusion
- Ignoring sample size limitations
""",
    model=Config.MODEL,
    tools=[execute_sql_query, create_visualization],
    output_type=list[DataInsight],
)

# Report Generation Agent
report_agent = Agent(
    name="Report Writer",
    handoff_description="Expert at creating analysis reports",
    instructions="""You are a business report writer. Create clear, professional reports.

Report structure:
1. Executive Summary - Key findings in 2-3 sentences
2. Insights - Detailed findings with supporting data
3. Recommendations - Actionable next steps
4. Methodology - Brief description of analysis approach

Writing guidelines:
- Use clear, non-technical language
- Lead with the most important findings
- Include specific numbers and percentages
- Make recommendations actionable and prioritized
- Keep reports concise but complete
""",
    model=Config.MODEL,
    tools=[save_analysis_report],
    output_type=AnalysisReport,
)

# Main Orchestrator Agent
analysis_orchestrator = Agent(
    name="Analysis Orchestrator",
    instructions=f"""You orchestrate data analysis workflows.

Your role:
1. Understand the analysis request
2. Break it into steps
3. Delegate to specialist agents:
   - SQL Expert: For querying data
   - Data Analyst: For extracting insights
   - Report Writer: For creating reports

DATABASE SCHEMA:
{DATABASE_SCHEMA}

Workflow:
1. First, understand what data is needed
2. Use SQL Expert to query the data
3. Use Data Analyst to find insights
4. Use Report Writer to create final report

Always:
- Clarify ambiguous requests
- Validate data quality before analysis
- Present findings clearly
""",
    model=Config.MODEL,
    tools=[get_table_schema],
    handoffs=[sql_agent, insight_agent, report_agent],
)


# =============================================================================
# Main Runner
# =============================================================================

async def run_analysis(question: str) -> str:
    """Run a data analysis."""

    with custom_span("data_analysis", {"question_preview": question[:100]}):
        result = await Runner.run(
            analysis_orchestrator,
            question,
        )
        return result.final_output


async def main():
    """Example usage."""
    print("Data Analysis Agent Ready")
    print("=" * 50)

    # Example analysis requests
    questions = [
        "What were our total sales last month by customer segment?",
        "Which products have the highest profit margin?",
        "Create a report on customer retention trends",
    ]

    for question in questions:
        print(f"\nQuestion: {question}")
        print("-" * 40)
        response = await run_analysis(question)
        print(f"Response:\n{response}")


if __name__ == "__main__":
    asyncio.run(main())
