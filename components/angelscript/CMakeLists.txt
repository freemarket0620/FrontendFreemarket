file(GLOB ANGELSCRIPT_SOURCES
    "source/*.cpp"
)

idf_component_register(
    SRCS ${ANGELSCRIPT_SOURCES}
    INCLUDE_DIRS "include" "source"
)

target_compile_options(${COMPONENT_LIB} PRIVATE
    -Wno-error
    -Wno-error=strict-aliasing
    -Wno-strict-aliasing
    -fno-strict-aliasing

    -Wno-error=empty-body
    -Wno-empty-body

    -Wno-error=cast-function-type
    -Wno-cast-function-type

    -Wno-error=attributes
    -Wno-attributes

    -DAS_NO_EXCEPTIONS
    -DAS_POSIX_THREADS
)