from app.database import Base, engine
from app.models import User, DayTask, UserActivity

try:
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")
    print("\nTables created:")
    for table in Base.metadata.sorted_tables:
        print(f"  - {table.name}")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
