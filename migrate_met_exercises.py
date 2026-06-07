import json
import uuid

def migrate_exercises(input_file, output_sql_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    modules = data.get('modules', [])
    
    sql_statements = []
    sql_statements.append("-- Migration script for MET B2 Vocabulary Exercises")
    sql_statements.append("-- Generated automatically")

    for module in modules:
        module_title = module.get('title', 'Unknown Module')
        module_level = module.get('levelRange', '')
        target_vocab = module.get('targetVocabulary', [])
        
        for exercise in module.get('exercises', []):
            # 1. Extract basic fields
            ex_id = exercise.get('id', str(uuid.uuid4()))
            ex_type = exercise.get('type', 'unknown')
            ex_title = exercise.get('title', 'Untitled Exercise')
            ex_difficulty = exercise.get('difficulty', '')
            ex_skill_focus = exercise.get('skillFocus', [])
            
            # 2. Construct tags: Module title + skill focus
            tags = [module_title] + ex_skill_focus
            # Clean tags (remove potential non-string or empty tags)
            tags = [str(t).strip() for t in tags if t]

            # 3. Construct content (the jsonb blob)
            # We include the original exercise data AND the module context
            content = {
                "original_id": ex_id,
                "module_context": {
                    "module_id": module.get('id'),
                    "module_title": module_title,
                    "target_vocabulary": target_vocab
                },
                "exercise_data": exercise
            }

            # 4. Prepare SQL Values
            # Handle escaping for single quotes in strings
            def escape(s):
                if s is None: return "NULL"
                return "'" + str(s).replace("'", "''") + "'"

            # For JSONB, we use PostgreSQL's JSON syntax
            content_json = json.dumps(content, ensure_ascii=False)
            escaped_content = escape(content_json)
            
            # For tags (text array), we use PostgreSQL array syntax: ARRAY['tag1', 'tag2']
            if tags:
                tags_sql = "ARRAY[" + ", ".join([escape(t) for t in tags]) + "]"
            else:
                tags_sql = "'{}'"

            # Construct the INSERT statement
            # Note: We don't provide teacher_id here because it defaults to auth.uid()
            # In a real migration, you might want to specify a specific teacher_id.
            sql = (
                f"INSERT INTO public.exercises (type, title, tags, level, content) "
                f"VALUES ({escape(ex_type)}, {escape(ex_title)}, {tags_sql}, {escape(ex_difficulty or module_level)}, {escaped_content});"
            )
            sql_statements.append(sql)

    with open(output_sql_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_statements))

    print(f"Successfully generated {len(sql_statements)-2} insert statements in {output_sql_file}")

if __name__ == "__main__":
    INPUT_JSON = "met_b2_vocab_interactive_exercises.json"
    OUTPUT_SQL = "migrate_met_exercises.sql"
    migrate_exercises(INPUT_JSON, OUTPUT_SQL)
